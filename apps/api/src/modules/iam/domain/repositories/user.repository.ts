import { type User } from '../aggregates/user.aggregate';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
