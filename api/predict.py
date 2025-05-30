import json
from http.server import BaseHTTPRequestHandler
import numpy as np
import pickle
import os
from urllib.parse import parse_qs

# In a production environment, you would load the model from a persistent storage
# For this example, we're creating a simple prediction function
class TransactionPredictor:
    def __init__(self):
        # Model would normally be loaded here
        # For example: self.model = pickle.load(open('model.pkl', 'rb'))
        pass
    
    def predict(self, features):
        """
        Predict risk score for a transaction
        This is a dummy implementation - in reality, you would use your ML model
        """
        # Example features that might be passed:
        # - transaction_value
        # - gas_price
        # - is_contract_interaction
        # - recipient_age_days
        # - sender_transaction_count
        
        # Simplified logic for demo purposes
        risk_score = 0
        
        # High value transactions increase risk
        if features.get('transaction_value', 0) > 1.0:
            risk_score += 0.3
            
        # Contract interactions may be riskier
        if features.get('is_contract_interaction', False):
            risk_score += 0.2
            
        # New recipients are riskier
        if features.get('recipient_age_days', 0) < 30:
            risk_score += 0.25
            
        # Cap the score at 0.95
        risk_score = min(risk_score, 0.95)
        
        # Add some factors that reduce risk
        if features.get('sender_transaction_count', 0) > 100:
            risk_score *= 0.8  # Frequent transactors might be less risky
            
        return {
            'risk_score': risk_score,
            'risk_level': self._score_to_level(risk_score),
            'factors': self._explain_score(features, risk_score)
        }
    
    def _score_to_level(self, score):
        """Convert numeric score to risk level"""
        if score < 0.2:
            return "LOW"
        elif score < 0.5:
            return "MEDIUM"
        elif score < 0.8:
            return "HIGH"
        else:
            return "CRITICAL"
    
    def _explain_score(self, features, score):
        """Generate explanation factors for the risk score"""
        factors = []
        
        if features.get('transaction_value', 0) > 1.0:
            factors.append("High-value transaction")
            
        if features.get('is_contract_interaction', False):
            factors.append("Contract interaction detected")
            
        if features.get('recipient_age_days', 0) < 30:
            factors.append("Recipient address is relatively new")
            
        if not factors:
            factors.append("No specific risk factors identified")
            
        return factors

# Initialize the predictor
predictor = TransactionPredictor()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        try:
            # Parse transaction data
            tx_data = json.loads(post_data)
            
            # Get prediction
            prediction = predictor.predict(tx_data)
            
            # Return prediction
            self.wfile.write(json.dumps(prediction).encode())
        except Exception as e:
            error_response = {
                "error": "Prediction error",
                "details": str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())
