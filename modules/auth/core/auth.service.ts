import bcrypt from "bcryptjs";

import { LoginInput, SignupInput } from "@/modules/auth/core/auth.schemas";
import {
  createUser,
  findUserByEmail,
} from "@/modules/auth/core/auth.repository";

export async function loginUser(input: LoginInput) {
  const user = await findUserByEmail(input.email);

  if (!user) {
    return {
      success: false as const,
      status: 401,
      message: "Invalid email or password",
    };
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    return {
      success: false as const,
      status: 401,
      message: "Invalid email or password",
    };
  }

  return {
    success: true as const,
    status: 200,
    message: "Login successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

export async function signupUser(input: SignupInput) {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    return {
      success: false as const,
      status: 409,
      message: "An account with this email already exists",
    };
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await createUser({
    name: input.name.trim(),
    email: input.email,
    password: hashedPassword,
  });

  return {
    success: true as const,
    status: 201,
    message: "Account created successfully",
    user,
  };
}
