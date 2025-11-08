#!/usr/bin/env python3
"""
Load test script for POST /users endpoint
Generates unique emails for each request to avoid constraint violations
"""

import requests
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import uuid

class LoadTester:
    def __init__(self, url, total_requests=10000, concurrency=100):
        self.url = url
        self.total_requests = total_requests
        self.concurrency = concurrency
        self.latencies = []
        self.errors = []
        self.lock = Lock()
        self.success_count = 0
        self.error_count = 0
        
    def make_request(self, request_id):
        """Make a single POST request with unique email"""
        unique_email = f"user-{uuid.uuid4()}@test.com"
        payload = {
            "email": unique_email,
            "firstName": "Benchmark",
            "lastName": "User",
            "password": "test123"
        }
        
        start_time = time.time()
        try:
            response = requests.post(
                self.url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            latency = (time.time() - start_time) * 1000  # ms
            
            with self.lock:
                self.latencies.append(latency)
                if response.status_code == 201 or response.status_code == 200:
                    self.success_count += 1
                else:
                    self.error_count += 1
                    self.errors.append(f"Status {response.status_code}: {response.text[:100]}")
                    
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            with self.lock:
                self.error_count += 1
                self.latencies.append(latency)
                self.errors.append(str(e))
                
    def run(self):
        """Execute load test"""
        print(f"🚀 Starting load test: {self.total_requests} requests with {self.concurrency} concurrent connections")
        print(f"📍 Target: POST {self.url}\n")
        
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=self.concurrency) as executor:
            futures = [executor.submit(self.make_request, i) for i in range(self.total_requests)]
            
            # Progress tracking
            completed = 0
            for future in as_completed(futures):
                completed += 1
                if completed % 1000 == 0:
                    elapsed = time.time() - start_time
                    rate = completed / elapsed
                    print(f"  Progress: {completed}/{self.total_requests} ({rate:.0f} req/s)")
        
        total_time = time.time() - start_time
        self.print_results(total_time)
        
    def print_results(self, total_time):
        """Print benchmark results"""
        print(f"\n{'='*60}")
        print(f"📊 BENCHMARK RESULTS")
        print(f"{'='*60}\n")
        
        print(f"Total Requests:     {self.total_requests}")
        print(f"Successful:         {self.success_count} ({self.success_count/self.total_requests*100:.1f}%)")
        print(f"Failed:             {self.error_count} ({self.error_count/self.total_requests*100:.1f}%)")
        print(f"Duration:           {total_time:.2f}s")
        print(f"Requests/sec:       {self.total_requests/total_time:.2f}")
        
        if self.latencies:
            self.latencies.sort()
            print(f"\nLatency Statistics (ms):")
            print(f"  Min:     {min(self.latencies):.2f}")
            print(f"  Median:  {statistics.median(self.latencies):.2f}")
            print(f"  Mean:    {statistics.mean(self.latencies):.2f}")
            print(f"  P95:     {self.latencies[int(len(self.latencies) * 0.95)]:.2f}")
            print(f"  P99:     {self.latencies[int(len(self.latencies) * 0.99)]:.2f}")
            print(f"  Max:     {max(self.latencies):.2f}")
            
        if self.errors and len(self.errors) <= 10:
            print(f"\nSample Errors:")
            for err in self.errors[:10]:
                print(f"  - {err}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python3 load-test-write.py <url> [requests] [concurrency]")
        print("Example: python3 load-test-write.py http://localhost:3000/users 1000 50")
        sys.exit(1)
        
    url = sys.argv[1]
    requests_count = int(sys.argv[2]) if len(sys.argv) > 2 else 10000
    concurrency = int(sys.argv[3]) if len(sys.argv) > 3 else 100
    
    tester = LoadTester(url, requests_count, concurrency)
    tester.run()
