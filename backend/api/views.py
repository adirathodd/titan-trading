from django.http import JsonResponse
from rest_framework.views import APIView
from . models import *
from rest_framework.response import Response
from . serializer import *

def dashboard(request):
    data = {
        'message': 'Hello from Django!',
        'status': 'success',
    }
    return JsonResponse(data)

class ReactView(APIView):
    serializer_class = ReactSerializer

    def get(self, request):
        detail = [ {"name": detail.name,"detail": detail.detail} 
        for detail in React.objects.all()]
        return Response(detail)

    def post(self, request):

        serializer = ReactSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return  Response(serializer.data)
