#!/usr/bin/env python3
"""
Simple test script to verify the connection to the external ML API
"""

import json
import requests

# External ML API endpoint
ML_API_URL = "https://fraud-transaction-detection-uaxt.onrender.com/predict"

def test_ml_api():
    """Send a test transaction to the external ML API"""
    print("\nTesting external ML API connection...\n")
    
    # Create a test transaction matching the required format for the external API
    sample_transaction = {
        "from_address": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
        "to_address": "0x8ba1f109551bD432803012645Hac136c22C501",
        "transaction_value": 5.0,
        "gas_price": 20,
        "is_contract_interaction": False,
        "acc_holder": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b",
        "features": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 5.0, 20.0, 0.0, 0.0, 0.0]  # 18 features as required by the API
    }
    
    try:
        # Call the API
        print(f"Sending request to {ML_API_URL}...")
        response = requests.post(
            ML_API_URL, 
            json=sample_transaction,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # Check the response
        if response.status_code == 200:
            result = response.json()
            print("\n✅ Successfully connected to external ML API!")
            print("\nAPI response:")
            print(json.dumps(result, indent=2))
        else:
            print(f"\n❌ API returned error: {response.status_code}")
            print(response.text)
    
    except Exception as e:
        print(f"\n❌ Failed to connect to API: {str(e)}")

if __name__ == "__main__":
    test_ml_api()
