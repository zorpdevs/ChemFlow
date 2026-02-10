from django.urls import path
from .views import UploadView, SummaryView, HistoryView, GeneratePDFView, RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('upload/', UploadView.as_view(), name='upload'),
    path('summary/', SummaryView.as_view(), name='summary'),
    path('history/', HistoryView.as_view(), name='history'),
    path('generate-pdf/', GeneratePDFView.as_view(), name='generate-pdf'),
]
