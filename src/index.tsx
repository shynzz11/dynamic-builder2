import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client"; // Correct import for React 18
import "./index.css";

// Interfaces
interface FormResponse {
  message: string;
  form: {
    formTitle: string;
    formId: string;
    version: string;
    sections: FormSection[];
  };
}

interface FormSection {
  sectionId: number;
  title: string;
  description: string;
  fields: FormField[];
}

interface FormField {
  fieldId: string;
  type:
    | "text"
    | "tel"
    | "email"
    | "textarea"
    | "date"
    | "dropdown"
    | "radio"
    | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  dataTestId: string;
  validation?: {
    message: string;
  };
  options?: Array<{
    value: string;
    label: string;
    dataTestId?: string;
  }>;
  maxLength?: number;
  minLength?: number;
}

interface FormData {
  [key: string]: string | boolean | string[];
}

// Login Component
const Login: React.FC<{
  onLogin: (rollNumber: string, name: string) => void;
}> = ({ onLogin }) => {
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "https://dynamic-form-generator-9rl7.onrender.com/create-user",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rollNumber, name }),
        }
      );
      if (response.ok) {
        onLogin(rollNumber, name);
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Roll Number</label>
          <input
            type="text"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        >
          Login
        </button>
      </div>
    </div>
  );
};

// Form Component
const DynamicForm: React.FC<{ rollNumber: string }> = ({ rollNumber }) => {
  const [formData, setFormData] = useState<FormResponse | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [formValues, setFormValues] = useState<FormData>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(
          `https://dynamic-form-generator-9rl7.onrender.com/get-form?rollNumber=${rollNumber}`
        );
        const data: FormResponse = await response.json();
        setFormData(data);
      } catch (err) {
        console.error("Error fetching form:", err);
      }
    };
    fetchForm();
  }, [rollNumber]);

  const validateField = (
    field: FormField,
    value: string | boolean | string[]
  ) => {
    if (field.required && !value) {
      return field.validation?.message || `${field.label} is required`;
    }
    if (typeof value === "string") {
      if (field.minLength && value.length < field.minLength) {
        return `Minimum length is ${field.minLength} characters`;
      }
      if (field.maxLength && value.length > field.maxLength) {
        return `Maximum length is ${field.maxLength} characters`;
      }
    }
    return "";
  };

  const validateSection = (section: FormSection) => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;
    section.fields.forEach((field) => {
      const value = formValues[field.fieldId];
      const error = validateField(field, value);
      if (error) {
        newErrors[field.fieldId] = error;
        isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (fieldId: string, value: string | boolean) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const handleNext = () => {
    if (formData && validateSection(formData.form.sections[currentSection])) {
      setCurrentSection((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentSection((prev) => prev - 1);
  };

  const handleSubmit = () => {
    if (formData && validateSection(formData.form.sections[currentSection])) {
      console.log("Form Data:", formValues);
    }
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.fieldId,
      name: field.fieldId,
      required: field.required,
      "data-testid": field.dataTestId,
      className: "w-full p-2 border rounded-md",
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case "text":
      case "tel":
      case "email":
      case "date":
        return (
          <input
            {...commonProps}
            type={field.type}
            value={(formValues[field.fieldId] as string) || ""}
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
          />
        );
      case "textarea":
        return (
          <textarea
            {...commonProps}
            value={(formValues[field.fieldId] as string) || ""}
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
          />
        );
      case "dropdown":
        return (
          <select
            {...commonProps}
            value={(formValues[field.fieldId] as string) || ""}
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                data-testid={option.dataTestId}
              >
                {option.label}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name={field.fieldId}
                  value={option.value}
                  checked={formValues[field.fieldId] === option.value}
                  onChange={(e) =>
                    handleInputChange(field.fieldId, e.target.value)
                  }
                  data-testid={option.dataTestId}
                  className="mr-2"
                />
                {option.label}
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <input
            {...commonProps}
            type="checkbox"
            checked={formValues[field.fieldId] as boolean}
            onChange={(e) => handleInputChange(field.fieldId, e.target.checked)}
          />
        );
      default:
        return null;
    }
  };

  if (!formData) return <div>Loading...</div>;

  const currentSectionData = formData.form.sections[currentSection];

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{formData.form.formTitle}</h2>
      <div className="mb-6">
        <h3 className="text-xl font-semibold">{currentSectionData.title}</h3>
        <p className="text-gray-600">{currentSectionData.description}</p>
      </div>
      <div className="space-y-4">
        {currentSectionData.fields.map((field) => (
          <div key={field.fieldId}>
            <label className="block text-sm font-medium">{field.label}</label>
            {renderField(field)}
            {errors[field.fieldId] && (
              <p className="text-red-500 text-sm mt-1">
                {errors[field.fieldId]}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        {currentSection > 0 && (
          <button
            onClick={handlePrev}
            className="bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600"
          >
            Previous
          </button>
        )}
        {currentSection < formData.form.sections.length - 1 ? (
          <button
            onClick={handleNext}
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

// Main App
const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [rollNumber, setRollNumber] = useState("");

  const handleLogin = (rollNumber: string, name: string) => {
    setRollNumber(rollNumber);
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <DynamicForm rollNumber={rollNumber} />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
