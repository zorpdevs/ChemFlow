import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status, permissions, generics
from django.http import HttpResponse
from .models import EquipmentSummary, EquipmentTypeDistribution
from .serializers import EquipmentSummarySerializer, UserSerializer
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

class UploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        if not file_obj.name.endswith('.csv'):
            return Response({'error': 'File must be CSV'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            df = pd.read_csv(file_obj)
            # Expected columns: Equipment Name, Type, Flowrate, Pressure, Temperature
            required_cols = ['Equipment Name', 'Type', 'Flowrate', 'Pressure', 'Temperature']
            if not all(col in df.columns for col in required_cols):
                 return Response({'error': f'Missing columns. Required: {required_cols}'}, status=status.HTTP_400_BAD_REQUEST)

            # Calculate stats
            total_count = len(df)
            avg_flowrate = df['Flowrate'].mean()
            avg_pressure = df['Pressure'].mean()
            avg_temperature = df['Temperature'].mean()
            type_counts = df['Type'].value_counts()

            # Save Summary
            summary = EquipmentSummary.objects.create(
                total_count=total_count,
                avg_flowrate=avg_flowrate,
                avg_pressure=avg_pressure,
                avg_temperature=avg_temperature
            )

            # Save Distribution
            for dtype, count in type_counts.items():
                EquipmentTypeDistribution.objects.create(
                    summary=summary,
                    equipment_type=dtype,
                    count=count
                )
            
            # Delete old records, keep only last 5
            # We want to keep the 5 most recent summaries
            recent_ids = EquipmentSummary.objects.order_by('-created_at').values_list('id', flat=True)[:5]
            EquipmentSummary.objects.exclude(id__in=recent_ids).delete()
            
            serializer = EquipmentSummarySerializer(summary)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        summary = EquipmentSummary.objects.order_by('-created_at').first()
        if not summary:
             return Response({'message': 'No data available'}, status=status.HTTP_404_NOT_FOUND)
        serializer = EquipmentSummarySerializer(summary)
        return Response(serializer.data)

class HistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        summaries = EquipmentSummary.objects.order_by('-created_at')[:5]
        serializer = EquipmentSummarySerializer(summaries, many=True)
        return Response(serializer.data)

class GeneratePDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Generate PDF based on latest summary
        summary = EquipmentSummary.objects.order_by('-created_at').first()
        if not summary:
            return Response({'error': 'No data available to generate report'}, status=status.HTTP_404_NOT_FOUND)

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Header
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, height - 50, "Chemical Equipment Parameter Report")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, height - 80, f"Date: {summary.created_at.strftime('%Y-%m-%d %H:%M:%S')}")

        # Stats
        p.drawString(50, height - 120, f"Total Equipment Count: {summary.total_count}")
        p.drawString(50, height - 140, f"Average Flowrate: {summary.avg_flowrate:.2f}")
        p.drawString(50, height - 160, f"Average Pressure: {summary.avg_pressure:.2f}")
        p.drawString(50, height - 180, f"Average Temperature: {summary.avg_temperature:.2f}")

        # Distribution
        p.drawString(50, height - 220, "Equipment Type Distribution:")
        y = height - 240
        for dist in summary.type_distribution.all():
            p.drawString(70, y, f"- {dist.equipment_type}: {dist.count}")
            y -= 20

        p.showPage()
        p.save()

        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf')
