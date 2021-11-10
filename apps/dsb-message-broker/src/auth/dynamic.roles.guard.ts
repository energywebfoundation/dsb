import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { extractFqcn } from '../utils';

@Injectable()
export class DynamicRolesGuard implements CanActivate {
    private readonly logger = new Logger();
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoleTitle = this.reflector.get<string>('role', context.getHandler());
        if (!requiredRoleTitle) return true;
        const requiredRoles = [`${requiredRoleTitle}.roles.dsb.apps.energyweb.iam.ewc`];

        const request = context.switchToHttp().getRequest();
        const { app, method, url, user } = request;
        const verifiedRoles = user.verifiedRoles?.map((role: any) => role.namespace) || [];
        if (!verifiedRoles.length) {
            this.logger.error({
                request: { app, method, url },
                message: ["403 - token doesn't have verified roles"]
            });
            return false;
        }

        const fqcn =
            context.switchToHttp().getRequest()?.body?.fqcn ??
            context.switchToHttp().getRequest()?.params?.fqcn ??
            context.switchToHttp().getRequest()?.query?.fqcn ??
            context.switchToWs().getData()?.fqcn;

        if (fqcn) {
            const { org, app } = extractFqcn(fqcn);
            if (!org || !app) return true; // it will be handled in FqcnValidationPipe. Otherwise this method will returns false which results in an irrelevant 403 error.
            const organizationRole = `${requiredRoleTitle}.roles.${app}.apps.${org}.iam.ewc`;
            if (!requiredRoles.includes(organizationRole)) requiredRoles.push(organizationRole);
        }

        const authorized = requiredRoles.every((req: string) =>
            verifiedRoles.some((ver: string) => ver === req)
        );
        if (!authorized) {
            this.logger.error({
                request: { app, method, url },
                message: ["403 - user verified roles doesn't match with required roles"]
            });
        }
        return authorized;
    }
}
