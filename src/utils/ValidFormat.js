export const ValidFormat = (formData, setErrors) => {
  let newErrors = {};

  Object.keys(formData).forEach((key) => {
    if (!formData[key]) newErrors[key] = "This field is required";
  });

  const licensePattern = /^[A-Z]\d{2}-\d{2}-\d{6}$/;
  if (formData.licenseNo && !licensePattern.test(formData.licenseNo)) {
    newErrors.licenseNo = "License must follow format: LNN-NN-NNNNNN (e.g. D12-34-567890)";
  }

  if (formData.password.length < 6) {
    newErrors.password = "Password must be at least 6 characters";
  }

  if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = "Passwords do not match";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
