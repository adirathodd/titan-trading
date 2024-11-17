from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.urls import reverse
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string
from django.utils import timezone
from datetime import datetime

def send_verification_email(user, request):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    verification_link = f"http://localhost:3000/verify/{uid}/{token}/"
    
    subject = 'Verify Your Email'
    from_email = 'Titan Paper Trading Platform <no-reply@titan.com>' 
    to_email = user.email
    
    html_content = render_to_string('api/verification_email.html', {
        'user': user,
        'verification_link': verification_link,
        'current_year': datetime.now().year,
    })

    email = EmailMultiAlternatives(subject, '', from_email, [to_email])
    email.attach_alternative(html_content, "text/html")
    email.send()