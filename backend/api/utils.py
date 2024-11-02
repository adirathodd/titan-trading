# accounts/utils.py
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator

def send_verification_email(user, request):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    verification_link = f"http://localhost:3000/verify/{uid}/{token}/"
    subject = 'Verify your email'
    message = f'Hey {user.username},\n\nPlease verify your email by clicking the link below:\n{verification_link}'
    send_mail(subject, message, settings.EMAIL_HOST_USER, [user.email])