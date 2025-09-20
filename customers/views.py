from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Customer
from .serializers import CustomerSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    
    @action(detail=False, methods=['get'])
    def by_email(self, request):
        email = request.query_params.get('email', None)
        if email:
            customers = Customer.objects.filter(email__icontains=email)
            serializer = self.get_serializer(customers, many=True)
            return Response(serializer.data)
        return Response([])
