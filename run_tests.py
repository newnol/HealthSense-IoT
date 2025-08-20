#!/usr/bin/env python3
"""
Script để chạy tests nhanh cho HealthSense-IoT API
Sử dụng: python run_tests.py [module_name]
"""

import sys
import subprocess
import os
from pathlib import Path

def main():
    """Chạy tests với các options phù hợp."""
    
    # Đảm bảo chúng ta ở đúng thư mục project
    project_root = Path(__file__).parent
    os.chdir(project_root)
    
    # Thiết lập PYTHONPATH
    os.environ['PYTHONPATH'] = str(project_root)
    
    # Base command
    cmd = ['python', '-m', 'pytest']
    
    # Thêm options mặc định
    cmd.extend([
        '-v',  # verbose
        '--tb=short',  # short traceback
        '--disable-warnings',  # ẩn warnings
    ])
    
    # Nếu có argument, chạy test cụ thể
    if len(sys.argv) > 1:
        module_name = sys.argv[1]
        
        # Nếu không có 'test_' prefix, thêm vào
        if not module_name.startswith('test_'):
            module_name = f'test_{module_name}'
        
        # Nếu không có .py suffix, thêm vào
        if not module_name.endswith('.py'):
            module_name = f'{module_name}.py'
            
        test_file = f'tests/{module_name}'
        
        if not os.path.exists(test_file):
            print(f"❌ Test file không tồn tại: {test_file}")
            print("📁 Các test files có sẵn:")
            for f in os.listdir('tests'):
                if f.startswith('test_') and f.endswith('.py'):
                    print(f"   - {f[5:-3]}")  # Bỏ 'test_' và '.py'
            return 1
            
        cmd.append(test_file)
        print(f"🧪 Chạy tests cho module: {module_name}")
    else:
        cmd.append('tests/')
        print("🧪 Chạy tất cả tests...")
    
    # Chạy pytest
    try:
        result = subprocess.run(cmd, check=False)
        
        if result.returncode == 0:
            print("\n✅ Tất cả tests đã pass!")
        else:
            print(f"\n❌ Có {result.returncode} tests failed!")
            
        return result.returncode
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests bị interrupted!")
        return 1
    except Exception as e:
        print(f"\n💥 Lỗi khi chạy tests: {e}")
        return 1

def show_help():
    """Hiển thị hướng dẫn sử dụng."""
    print("""
🧪 HealthSense-IoT Test Runner

Cách sử dụng:
  python run_tests.py              # Chạy tất cả tests
  python run_tests.py auth         # Chạy tests cho auth module
  python run_tests.py records      # Chạy tests cho records module
  python run_tests.py profile      # Chạy tests cho profile module
  python run_tests.py ai           # Chạy tests cho AI module
  python run_tests.py admin        # Chạy tests cho admin module
  python run_tests.py command      # Chạy tests cho command module
  python run_tests.py login        # Chạy tests cho login module

Các options khác:
  pytest tests/ --cov=api                    # Với coverage
  pytest tests/test_auth.py::TestClass::test_method  # Test cụ thể
  pytest -k "test_name_pattern"              # Filter theo tên
  pytest -m "not slow"                       # Bỏ qua slow tests
""")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] in ['-h', '--help', 'help']:
        show_help()
        sys.exit(0)
        
    sys.exit(main())
