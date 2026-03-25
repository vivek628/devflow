import bcrypt from "bcryptjs";

import { LoginInput } from "@/lib/validations/auth";
import { findUserByEmail } from "@/repositories/user-repository/user.repository";

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
