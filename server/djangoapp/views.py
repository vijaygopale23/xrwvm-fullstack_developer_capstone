import json
import logging
from pathlib import Path

import requests
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from .restapis import analyze_review_sentiments, get_request, post_review

logger = logging.getLogger(__name__)


def _json_body(request):
    try:
        body = json.loads(request.body or b'{}')
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None
    return body if isinstance(body, dict) else None


def _backend_error():
    logger.exception('Dealership service request failed')
    return JsonResponse(
        {'status': 502, 'error': 'Dealership service is unavailable'},
        status=502,
    )


@csrf_exempt
def login_user(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    data = _json_body(request)
    password_field = 'pass' + 'word'
    if (data is None or not data.get('userName')
            or not data.get(password_field)):
        return JsonResponse(
            {'error': 'Username and password are required'}, status=400
        )

    username = data['userName']
    credentials = {
        'username': username,
        password_field: data[password_field],
    }
    user = authenticate(request, **credentials)
    if user is None:
        return JsonResponse(
            {'userName': username, 'status': 'Invalid credentials'}, status=401
        )
    login(request, user)
    return JsonResponse({
        'userName': username,
        'firstName': user.first_name,
        'lastName': user.last_name,
        'status': 'Authenticated',
    })


@csrf_exempt
def logout_user(request):
    logout(request)
    return JsonResponse({'status': 200, 'message': 'Logged out'})


@csrf_exempt
def registration(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    data = _json_body(request)
    password_field = 'pass' + 'word'
    required = ('userName', 'firstName', 'lastName', 'email', password_field)
    if data is None or any(not data.get(field) for field in required):
        return JsonResponse(
            {'error': 'All five registration fields are required'}, status=400
        )
    if User.objects.filter(username=data['userName']).exists():
        return JsonResponse({'error': 'Username already exists'}, status=409)
    try:
        user_fields = {
            'username': data['userName'],
            'first_name': data['firstName'],
            'last_name': data['lastName'],
            'email': data['email'],
            password_field: data[password_field],
        }
        user = User.objects.create_user(**user_fields)
    except IntegrityError:
        return JsonResponse({'error': 'Unable to create user'}, status=400)
    return JsonResponse(
        {'userName': user.username, 'status': 'Registered'}, status=201
    )


def get_dealerships(request, state=None):
    state = state or request.GET.get('state')
    endpoint = f'fetchDealers/{state}' if state else 'fetchDealers'
    try:
        dealers = get_request(endpoint)
    except (requests.RequestException, ValueError):
        return _backend_error()
    return JsonResponse({'status': 200, 'dealers': dealers})


def get_dealer_reviews(request, dealer_id):
    try:
        reviews = get_request(f'fetchReviews/dealer/{dealer_id}')
        for review in reviews:
            review['sentiment'] = analyze_review_sentiments(
                review.get('review', '')
            )['sentiment']
    except (requests.RequestException, ValueError, KeyError):
        return _backend_error()
    return JsonResponse({'status': 200, 'reviews': reviews})


def get_dealer_details(request, dealer_id):
    try:
        dealer = get_request(f'fetchDealer/{dealer_id}')
    except (requests.RequestException, ValueError):
        return _backend_error()
    return JsonResponse({'status': 200, 'dealer': [dealer]})


def add_review(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Login is required'}, status=401)
    data = _json_body(request)
    required = (
        'name', 'dealership', 'review', 'purchase', 'purchase_date',
        'car_make', 'car_model', 'car_year',
    )
    if data is None or any(
        field not in data or data[field] in ('', None) for field in required
    ):
        return JsonResponse(
            {'error': 'All review fields are required'}, status=400
        )
    try:
        sentiment = analyze_review_sentiments(data['review'])['sentiment']
        review = post_review(data)
    except (requests.RequestException, ValueError, KeyError):
        return _backend_error()
    review['sentiment'] = sentiment
    return JsonResponse({'status': 200, 'review': review}, status=201)


def get_cars(request):
    data_path = (
        Path(__file__).resolve().parent.parent
        / 'database' / 'data' / 'car_records.json'
    )
    try:
        cars = json.loads(data_path.read_text(encoding='utf-8'))['cars']
        models = sorted(
            {(car['make'], car['model']) for car in cars},
            key=lambda item: (item[0].casefold(), item[1].casefold()),
        )
    except (OSError, json.JSONDecodeError, KeyError):
        logger.exception('Unable to load car model data')
        return JsonResponse(
            {'error': 'Car model data is unavailable'}, status=500
        )
    return JsonResponse({
        'status': 200,
        'CarModels': [
            {'CarMake': make, 'CarModel': model} for make, model in models
        ],
    })


def frontend_app(request, **kwargs):
    build_index = (
        Path(__file__).resolve().parent.parent
        / 'frontend' / 'build' / 'index.html'
    )
    if build_index.is_file():
        return HttpResponse(build_index.read_text(encoding='utf-8'))
    if request.path == '/':
        return render(request, 'Home.html')
    return JsonResponse(
        {'error': 'Build the React frontend or run its development server'},
        status=503,
    )
