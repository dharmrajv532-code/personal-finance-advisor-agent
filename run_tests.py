#!/usr/bin/env python3
"""
FinPilot AI - Comprehensive Project Test Runner
Executes backend automated test suites and validates frontend production builds.
"""

import subprocess
import sys
import time
import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "finance-agent-backend"
FRONTEND_DIR = ROOT_DIR / "finance-agent-frontend"

def print_header(title):
    print("\n" + "=" * 65)
    print(f"  {title}")
    print("=" * 65)

def run_backend_tests():
    print_header("1. RUNNING BACKEND AUTOMATED TESTS")
    start = time.time()
    
    # Locate python in backend venv
    if os.name == "nt":
        python_bin = BACKEND_DIR / "venv" / "Scripts" / "python.exe"
    else:
        python_bin = BACKEND_DIR / "venv" / "bin" / "python"
        
    if not python_bin.exists():
        python_bin = Path(sys.executable)

    cmd = [str(python_bin), "-m", "unittest", "discover", "-s", "tests", "-v"]
    print(f"Command: {' '.join(cmd)}")
    print(f"Working Directory: {BACKEND_DIR}\n")
    
    result = subprocess.run(cmd, cwd=str(BACKEND_DIR), capture_output=True, text=True)
    duration = time.time() - start
    
    print(result.stdout)
    if result.stderr:
        print(result.stderr)
        
    passed = result.returncode == 0
    status_str = "PASSED" if passed else "FAILED"
    print(f"Backend Tests Result: [{status_str}] in {duration:.2f}s")
    return passed

def run_frontend_build_check():
    print_header("2. VALIDATING FRONTEND PRODUCTION BUILD")
    start = time.time()
    
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    cmd = [npm_cmd, "run", "build"]
    print(f"Command: {' '.join(cmd)}")
    print(f"Working Directory: {FRONTEND_DIR}\n")
    
    result = subprocess.run(cmd, cwd=str(FRONTEND_DIR), capture_output=True, text=True)
    duration = time.time() - start
    
    # Print relevant build output
    lines = result.stdout.splitlines()
    for line in lines[-25:]:  # show final summary lines
        print(line)
        
    if result.returncode != 0 and result.stderr:
        print(result.stderr)
        
    passed = result.returncode == 0
    status_str = "PASSED" if passed else "FAILED"
    print(f"\nFrontend Build Result: [{status_str}] in {duration:.2f}s")
    return passed

def main():
    print("\n" + "#" * 65)
    print("         FinPilot AI — Full System Test Suite")
    print("#" * 65)
    
    backend_ok = run_backend_tests()
    frontend_ok = run_frontend_build_check()
    
    print_header("TEST SUMMARY REPORT")
    print(f"  • Backend Unit & Integration Tests: {'[OK] PASSED' if backend_ok else '[X] FAILED'}")
    print(f"  • Frontend Next.js Production Build: {'[OK] PASSED' if frontend_ok else '[X] FAILED'}")
    print("=" * 65)
    
    if backend_ok and frontend_ok:
        print("\nAll tests passed successfully! The project is healthy and verified.")
        sys.exit(0)
    else:
        print("\nSome tests failed. Please review the output above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
