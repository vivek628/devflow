import bcrypt from "bcryptjs";

import { SignupInput } from "@/lib/validations/auth";
import { createUser, findUserByEmail } from "@/repositories/user-repository/user.repository";

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
