import base64
import os
import io
from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from typing import List
import face_recognition
from numpy import argmin
import numpy as np

app = FastAPI()

# Directory to store images
UPLOAD_DIR = "uploaded_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Global variable to store employee data
employee_list = []


# Employee Model
class Employee(BaseModel):
    name: str
    image: str # Base64 encoded image
    employee_name: str



class EmployeeList(BaseModel):
    employees: List[Employee]


# 1️⃣ *Store Employee List API*
@app.post("/store_employees/")
async def store_employees(data: EmployeeList):
    global employee_list
    stored_employees = []

    for employee in data.employees:
        if employee.image:
            # Decode Base64 image
            image_data = base64.b64decode(employee.image)
            file_path = os.path.join(UPLOAD_DIR, f"{employee.name}.jpg")

            # Save the decoded image
            with open(file_path, "wb") as file:
                file.write(image_data)

            # Get face encoding for the image and store it
            img = face_recognition.load_image_file(file_path)
            encodings = face_recognition.face_encodings(img)

            if encodings:
                stored_employees.append({"name": employee.name, "employee_name": employee.employee_name, "encoding": encodings[0].tolist()})
            else:
                stored_employees.append({"name": employee.name,  "employee_name": employee.employee_name, "encoding": None})

    employee_list = stored_employees  # Store employees in global list
    return {"message": "Employee list stored successfully", "employees": employee_list}


# 2️⃣ *Verify Faces API (Face Recognition between two images)*
@app.post("/verify_faces/")
async def verify_faces(image1: UploadFile = File(...), image2: UploadFile = File(...)):
    try:
        # Convert images to numpy arrays
        img1 = face_recognition.load_image_file(io.BytesIO(await image1.read()))
        img2 = face_recognition.load_image_file(io.BytesIO(await image2.read()))

        # Get face encodings
        encodings1 = face_recognition.face_encodings(img1)
        encodings2 = face_recognition.face_encodings(img2)

        if len(encodings1) == 0 or len(encodings2) == 0:
            return {"match": False, "message": "No face detected in one or both images"}

        # Compare faces
        result = face_recognition.compare_faces([encodings1[0]], encodings2[0])

        return {"match": bool(result[0])}
    except Exception as e:
        return {"match": False, "error": str(e)}


# 3️⃣ *Recognize Employee from Image API*
class ImageData(BaseModel):
    image: str  # Base64 encoded image


@app.post("/recognize_employee/")
async def recognize_employee(data: ImageData):
    global employee_list

    # Decode Base64 image
    image_data = base64.b64decode(data.image)
    query_image_path = os.path.join(UPLOAD_DIR, "query_image.jpg")

    # Save the uploaded image
    with open(query_image_path, "wb") as file:
        file.write(image_data)

    # Get face encoding for the query image
    query_img = face_recognition.load_image_file(query_image_path)
    query_encodings = face_recognition.face_encodings(query_img)

    if not query_encodings:
        return {"match": False, "message": "No face detected in the uploaded image"}

    query_encoding = query_encodings[0]

    # Store distances for all employees
    distances = []
    employee_names = []
    employee_ids = []

    for employee in employee_list:
        if employee["encoding"] is not None:
            distance = np.linalg.norm(np.array(employee["encoding"]) - np.array(query_encoding))
            distances.append(distance)
            employee_names.append(employee["employee_name"])
            employee_ids.append(employee["name"])

    if not distances:
        return {"match": False, "message": "No matching employee found"}

    # Find the best match (lowest distance)
    best_match_index = argmin(distances)
    best_distance = distances[best_match_index]

    # Set a strict threshold (lower = more accurate)
    THRESHOLD = 0.45  # Adjust based on testing

    if best_distance < THRESHOLD:
        return {
            "match": True,
            "employee_id": employee_ids[best_match_index],
            "employee_name": employee_names[best_match_index],
            "distance": best_distance
        }
    else:
        return {"match": False, "message": "No matching employee found"}

# 4️⃣ *Retrieve Stored Employee List API*
@app.get("/get_employees/")
async def get_employees():
    return {"employees": employee_list}  # Return stored employees


# 4️⃣ *Retrieve Stored Employee List API*
@app.get("/tst/")
async def get_employees():
    return {"employees": "working"}  # Return stored employees