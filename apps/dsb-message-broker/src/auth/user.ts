import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type User = {
    verifiedRoles: { name: string; namespace: string }[];
    did: string;
};

export const AuthenticatedUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as User;
});
