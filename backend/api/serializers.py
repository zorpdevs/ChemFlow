from rest_framework import serializers
from .models import ChemicalData

class ChemicalDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChemicalData
        fields = '__all__'
