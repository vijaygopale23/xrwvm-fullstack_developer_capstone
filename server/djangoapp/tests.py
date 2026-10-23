import json
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase


class AuthenticationTests(TestCase):
    def test_registration_login_and_logout(self):
        registration = {
            'userName': 'test-customer',
            'firstName': 'Test',
            'lastName': 'Customer',
            'email': 'test@example.test',
            'password': 'TestPassword-2026',
        }
        response = self.client.post(
            '/djangoapp/register',
            data=json.dumps(registration),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)

        response = self.client.post(
            '/djangoapp/login',
            data=json.dumps({
                'userName': registration['userName'],
                'password': registration['password'],
            }),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['status'], 'Authenticated')

        response = self.client.get('/djangoapp/logout')
        self.assertEqual(response.status_code, 200)
        self.assertFalse('_auth_user_id' in self.client.session)

    def test_registration_requires_all_fields(self):
        response = self.client.post(
            '/djangoapp/register',
            data=json.dumps({'userName': 'incomplete'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)


class DealershipApiTests(TestCase):
    def test_state_filter_uses_backend_state_route(self):
        with patch(
            'djangoapp.views.get_request',
            return_value=[{'id': 1, 'state': 'Kansas'}],
        ) as get_request:
            response = self.client.get('/djangoapp/get_dealers/Kansas')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['dealers'][0]['state'], 'Kansas')
        get_request.assert_called_once_with('fetchDealers/Kansas')

    def test_car_models_are_unique_make_model_pairs(self):
        response = self.client.get('/djangoapp/get_cars')
        self.assertEqual(response.status_code, 200)
        car_models = response.json()['CarModels']
        pairs = [(item['CarMake'], item['CarModel']) for item in car_models]
        self.assertTrue(pairs)
        self.assertEqual(len(pairs), len(set(pairs)))

    def test_review_submission_requires_login(self):
        response = self.client.post(
            '/djangoapp/add_review',
            data=json.dumps({'review': 'Fantastic services'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 401)

    def test_logged_in_review_is_sentiment_analyzed_and_saved(self):
        user = User(username='reviewer')
        user.set_password('test-password')
        user.save()
        self.client.force_login(user)
        review = {
            'name': 'Test Customer',
            'dealership': 1,
            'review': 'Fantastic services',
            'purchase': True,
            'purchase_date': '2026-10-21',
            'car_make': 'Honda',
            'car_model': 'Civic',
            'car_year': 2022,
        }
        with patch(
            'djangoapp.views.analyze_review_sentiments',
            return_value={'sentiment': 'positive'},
        ), patch(
            'djangoapp.views.post_review',
            return_value={'id': 7, **review},
        ):
            response = self.client.post(
                '/djangoapp/add_review',
                data=json.dumps(review),
                content_type='application/json',
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['review']['sentiment'], 'positive')
