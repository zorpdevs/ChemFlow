from rest_framework import serializers
from django.contrib.auth.models import User
from .models import EquipmentSummary, EquipmentTypeDistribution

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'email']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class EquipmentTypeDistributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentTypeDistribution
        fields = ['equipment_type', 'count']

class EquipmentSummarySerializer(serializers.ModelSerializer):
    type_distribution = EquipmentTypeDistributionSerializer(many=True, read_only=True)

    class Meta:
        model = EquipmentSummary
        fields = ['id', 'created_at', 'total_count', 'avg_flowrate', 'avg_pressure', 'avg_temperature', 'type_distribution']
