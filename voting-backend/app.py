import sys
import cv2
import hashlib
import os

# This ensures only the hash is printed, preventing Node.js from capturing logs
os.environ['OPENCV_LOG_LEVEL'] = 'OFF'

def generate_iris_hash(image_path):
    try:
        # 1. Fix Windows path formatting (converts \ to / if needed)
        clean_path = os.path.abspath(image_path)
        
        # 2. Verify file exists before opening
        if not os.path.exists(clean_path):
            return f"Error: Path {clean_path} does not exist"

        # 3. Read the image
        img = cv2.imread(clean_path)
        if img is None:
            return "Error: Could not read image data"

        # 4. Convert to grayscale and generate hash
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # We hash the raw pixel bytes for a unique 64-character string
        image_hash = hashlib.sha256(gray.tobytes()).hexdigest()

        return image_hash

    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    # Check if image path argument was provided by server.js
    if len(sys.argv) > 1:
        # Generate and print only the result for Node.js to capture
        result = generate_iris_hash(sys.argv[1])
        print(result.strip())
    else:
        print("Error: No image path provided")