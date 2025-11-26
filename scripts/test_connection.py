#!/usr/bin/env python3
"""
Test Firebolt connection with the credentials to validate they work.
"""

from firebolt.client import DEFAULT_API_URL
from firebolt.client.auth import ClientCredentials
from firebolt.db import connect

# Credentials
CLIENT_ID = "REDACTED_CLIENT_ID"
CLIENT_SECRET = "REDACTED_CLIENT_SECRET"
ACCOUNT_NAME = "se-demo-account"
DATABASE_NAME = "late_materialization_demo"
ENGINE_NAME = "ecommerceengine"

print("=" * 80)
print("Testing Firebolt Connection")
print("=" * 80)
print(f"Account: {ACCOUNT_NAME}")
print(f"Database: {DATABASE_NAME}")
print(f"Engine: {ENGINE_NAME}")
print("=" * 80)

try:
    print("\n[1/3] Authenticating...")
    auth = ClientCredentials(CLIENT_ID, CLIENT_SECRET)
    print("✓ Authentication object created")
    
    print("\n[2/3] Connecting to Firebolt...")
    connection = connect(
        auth=auth,
        account_name=ACCOUNT_NAME,
        database=DATABASE_NAME,
        engine_name=ENGINE_NAME,
        api_endpoint=DEFAULT_API_URL
    )
    print("✓ Connection established")
    
    print("\n[3/3] Testing query execution...")
    cursor = connection.cursor()
    cursor.execute("SELECT 1 as test")
    result = cursor.fetchone()
    print(f"✓ Query executed successfully: {result}")
    
    print("\n" + "=" * 80)
    print("✓ ALL TESTS PASSED - Connection is working!")
    print("=" * 80)
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print("\n" + "=" * 80)
    print(f"✗ CONNECTION FAILED")
    print("=" * 80)
    print(f"Error: {e}")
    print("\nFull traceback:")
    import traceback
    traceback.print_exc()
    exit(1)

