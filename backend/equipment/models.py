from django.db import models

class EquipmentSummary(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    total_count = models.IntegerField()
    avg_flowrate = models.FloatField()
    avg_pressure = models.FloatField()
    avg_temperature = models.FloatField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Summary {self.created_at}"

class EquipmentTypeDistribution(models.Model):
    summary = models.ForeignKey(EquipmentSummary, related_name='type_distribution', on_delete=models.CASCADE)
    equipment_type = models.CharField(max_length=100)
    count = models.IntegerField()

    def __str__(self):
        return f"{self.equipment_type}: {self.count}"
