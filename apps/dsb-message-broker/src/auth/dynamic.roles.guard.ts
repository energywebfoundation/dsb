import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { extractFqcn } from '../utils';

@Injectable()
export class DynamicRolesGuard implements CanActivate {
    constructor(
        private readonly configService: ConfigService,
        private readonly reflector: Reflector
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoleCategory = this.reflector.get<string>('role', context.getHandler());
        if (!requiredRoleCategory) return true;

        const organizations = this.configService.get('ORGANIZATIONS');

        const fqcn =
            context.switchToHttp().getRequest().body?.fqcn ??
            context.switchToHttp().getRequest().params?.fqcn ??
            context.switchToHttp().getRequest().query?.fqcn;
        if (!fqcn) return false;

        const { org, app } = extractFqcn(fqcn);
        const requiredRoles = (
            organizations
                .find((_org: any) => _org.name === org)
                ?.apps.find((_app: any) => _app.name === app)?.roles[requiredRoleCategory] || []
        ).map((role: string) => `${role}.roles.${app}.apps.${org}.iam.ewc`);

        const user = context.switchToHttp().getRequest().user;
        const verifiedRoles = user.verifiedRoles.map((role: any) => role.namespace);

        return verifiedRoles.some((verified: string) =>
            requiredRoles.some((required: string) => required === verified)
        );
    }
}
