export interface ValidationError {
  field: string;
  message: string;
}

export class FormValidator {
  static validateEmail(email: string): string | null {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  static validatePassword(password: string): string | null {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return null;
  }

  static validateName(name: string, fieldName: string): string | null {
    if (!name) {
      return `${fieldName} is required`;
    }
    if (name.length < 2) {
      return `${fieldName} must be at least 2 characters long`;
    }
    if (name.length > 50) {
      return `${fieldName} must be less than 50 characters`;
    }
    return null;
  }

  static validateLoginForm(email: string, password: string): ValidationError[] {
    const errors: ValidationError[] = [];

    const emailError = this.validateEmail(email);
    if (emailError) {
      errors.push({ field: 'email', message: emailError });
    }

    const passwordError = this.validatePassword(password);
    if (passwordError) {
      errors.push({ field: 'password', message: passwordError });
    }

    return errors;
  }

  static validateRegisterForm(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    const emailError = this.validateEmail(email);
    if (emailError) {
      errors.push({ field: 'email', message: emailError });
    }

    const passwordError = this.validatePassword(password);
    if (passwordError) {
      errors.push({ field: 'password', message: passwordError });
    }

    const firstNameError = this.validateName(firstName, 'First name');
    if (firstNameError) {
      errors.push({ field: 'firstName', message: firstNameError });
    }

    const lastNameError = this.validateName(lastName, 'Last name');
    if (lastNameError) {
      errors.push({ field: 'lastName', message: lastNameError });
    }

    return errors;
  }

  static parseGraphQLError(error: string): string {
    // Simple GraphQL error cleanup - mostly preserve original message
    // Remove technical prefixes but keep the actual error content
    return error.replace(/^(GraphQL error: |Error: )/i, '').trim();
  }
}
