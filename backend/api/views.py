import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status, permissions
from .models import ChemicalData
from .serializers import ChemicalDataSerializer
from django.db.models import Avg, Count

class UploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES['file']
        if not file_obj.name.endswith('.csv'):
            return Response({'error': 'File must be CSV'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            df = pd.read_csv(file_obj)
            # Expected columns: equipment_type, flowrate, pressure, temperature
            required_cols = ['equipment_type', 'flowrate', 'pressure', 'temperature']
            if not all(col in df.columns for col in required_cols):
                 return Response({'error': f'Missing columns. Required: {required_cols}'}, status=status.HTTP_400_BAD_REQUEST)

            # Clear old data for this demo (optional, but good for clean state)
            # ChemicalData.objects.all().delete() 

            instances = [
                ChemicalData(
                    equipment_type=row['equipment_type'],
                    flowrate=row['flowrate'],
                    pressure=row['pressure'],
                    temperature=row['temperature']
                )
                for _, row in df.iterrows()
            ]
            ChemicalData.objects.bulk_create(instances)
            
            return Response({'message': f'Uploaded {len(instances)} records successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = ChemicalData.objects.all()
        serializer = ChemicalDataSerializer(data, many=True)
        
        # Calculate summary
        total_count = data.count()
        aggs = data.aggregate(
            avg_flow=Avg('flowrate'),
            avg_press=Avg('pressure'),
            avg_temp=Avg('temperature')
        )
        
        summary = {
            'total_count': total_count,
            'avg_flowrate': aggs['avg_flow'] or 0,
            'avg_pressure': aggs['avg_press'] or 0,
            'avg_temperature': aggs['avg_temp'] or 0,
        }
        
        return Response({
            'summary': summary,
            'data': serializer.data
        })
