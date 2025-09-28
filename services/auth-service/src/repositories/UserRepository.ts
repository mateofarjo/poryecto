import { Types } from "mongoose";
import { UserModel, UserDocument, UserStatus } from "../models/User";

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  status?: UserStatus;
  role?: "user" | "admin";
}

class UserRepository {
  private static instance: UserRepository;

  static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    const user = new UserModel(input);
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(userId: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    return UserModel.findById(userId).exec();
  }

  async list(status?: UserStatus): Promise<UserDocument[]> {
    const query = status ? { status } : {};
    return UserModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async updateStatus(userId: string, status: UserStatus): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(userId, { status }, { new: true }).exec();
  }
}

export const userRepository = UserRepository.getInstance();
