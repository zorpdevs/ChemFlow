from django.urls import path
from .views import UploadView, SummaryView

urlpatterns = [
    path('upload/', UploadView.as_view(), name='upload'),
    path('summary/', SummaryView.as_view(), name='summary'),
]
