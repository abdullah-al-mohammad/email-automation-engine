import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { type ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema<unknown>) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Only validate the body. If we need to validate params/queries,
    // we should create specific pipes or check metadata properly.
    if (metadata.type !== 'body') {
      return value;
    }

    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errorMessages = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );

      throw new BadRequestException({
        message: errorMessages,
        error: 'Bad Request',
        statusCode: 400,
      });
    }

    return result.data;
  }
}
