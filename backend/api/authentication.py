import firebase_admin
from firebase_admin import auth, credentials
from django.contrib.auth.models import User
from rest_framework import authentication
from rest_framework import exceptions
from django.conf import settings
import os

# Initialize Firebase Admin SDK
try:
    if not firebase_admin._apps:
        cred_path = os.path.join(settings.BASE_DIR, 'serviceAccountKey.json')
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully.")
        else:
            print("CRITICAL WARNING: serviceAccountKey.json not found. Authentication will fail.")
except Exception as e:
    print(f"Firebase Admin Init Error: {e}")

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return None
            
        try:
            # Header format: Bearer <token>
            prefix, token = auth_header.split(' ')
            if prefix != 'Bearer':
                return None
            
            # Verify the ID token using Firebase Admin SDK
            # This will raise an error if the token is invalid, expired, or revoked
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token['uid']
            email = decoded_token.get('email', '')
            
            # Get or create a user based on the Firebase UID
            try:
                user = User.objects.get(username=uid)
            except User.DoesNotExist:
                # Create a new user if they don't exist in Django yet
                user = User.objects.create_user(
                    username=uid,
                    email=email,
                    password=None 
                )
                
            return (user, None)
            
        except ValueError as e:
            # Token invalid
            raise exceptions.AuthenticationFailed('Invalid Firebase token')
        except auth.ExpiredIdTokenError:
             raise exceptions.AuthenticationFailed('Token expired')
        except auth.RevokedIdTokenError:
             raise exceptions.AuthenticationFailed('Token revoked')
        except Exception as e:
            print(f"Auth Error: {str(e)}")
            raise exceptions.AuthenticationFailed('Authentication failed')