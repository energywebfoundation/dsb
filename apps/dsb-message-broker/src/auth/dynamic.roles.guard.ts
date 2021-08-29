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
        // console.log('requiredRoleCategory ', requiredRoleCategory);

        const user = context.switchToHttp().getRequest().user;
        // console.log('user ', user);

        const verifiedRoles = user.verifiedRoles?.map((role: any) => role.namespace) || [];
        // console.log('verifiedRoles ', verifiedRoles);

        if (!verifiedRoles.length) return false;

        const organizations = this.configService.get('ORGANIZATIONS');

        const fqcn =
            context.switchToHttp().getRequest().body?.fqcn ??
            context.switchToHttp().getRequest().params?.fqcn ??
            context.switchToHttp().getRequest().query?.fqcn;
        // console.log('fqcn ', fqcn);

        let requiredRoles: string[] = [];
        if (!fqcn) {
            /* 
              requiredRoles contains requiredRoleCategory roles from all apps in all orgs 
            */
            organizations.forEach((_org: any) => {
                _org.apps.forEach((_app: any) => {
                    _app?.roles[requiredRoleCategory].forEach((role: string) => {
                        requiredRoles.push(`${role}.roles.${_app.name}.apps.${_org.name}.iam.ewc`);
                    });
                });
            });
        } else {
            /* 
              requiredRoles contains requiredRoleCategory roles from a specific app in a specific org determined by fqcn
            */
            const { org, app } = extractFqcn(fqcn);
            if (!org || !app) return true; // it will be handled in CreateChannelPipe. Otherwise this method will returns false which results in an irrelevant 403 error.

            requiredRoles = (
                organizations
                    .find((_org: any) => _org.name === org)
                    ?.apps.find((_app: any) => _app.name === app)?.roles[requiredRoleCategory] || []
            ).map((role: string) => `${role}.roles.${app}.apps.${org}.iam.ewc`);
        }
        // console.log('requiredRoles ', requiredRoles);

        return verifiedRoles.some((verified: string) =>
            requiredRoles.some((required: string) => required === verified)
        );
    }
}
