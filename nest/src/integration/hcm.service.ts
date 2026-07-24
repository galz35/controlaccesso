import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HcmService {
  constructor(
    private config: ConfigService,
    private http: HttpService,
  ) {}

  private padCarnet(carnet: string): string {
    const num = parseInt(carnet, 10);
    if (isNaN(num)) return carnet;
    return String(num).padStart(6, '0');
  }

  async obtenerFotoEmpleado(carnet: string): Promise<string | null> {
    const url = this.config.get<string>('HCM_API_URL');
    const username = this.config.get<string>('HCM_USERNAME');
    const password = this.config.get<string>('HCM_PASSWORD');

    if (!url || !username || !password) return null;

    const carnetPad = this.padCarnet(carnet);

    try {
      const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: { Authorization: authHeader, Accept: 'application/json' },
          params: { onlyData: true, expand: 'photos', q: `PersonNumber='${carnetPad}'` },
          timeout: 5000,
        }),
      );
      const data = response.data;
      if (!data.items || data.items.length === 0) return null;
      const photos = data.items[0].photos;
      if (!photos || photos.length === 0) return null;
      const foto = photos.find((p: any) => p.PrimaryFlag === true) || photos[0];
      if (!foto?.Photo) return null;
      return `data:image/jpeg;base64,${foto.Photo}`;
    } catch {
      return null;
    }
  }

  async obtenerEstadoEmpleado(carnet: string): Promise<{ activo: boolean; cargo?: string; empresa?: string } | null> {
    const url = this.config.get<string>('HCM_API_URL');
    const username = this.config.get<string>('HCM_USERNAME');
    const password = this.config.get<string>('HCM_PASSWORD');

    if (!url || !username || !password) return null;

    const carnetPad = this.padCarnet(carnet);

    try {
      const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: { Authorization: authHeader, Accept: 'application/json' },
          params: {
            onlyData: true,
            expand: 'workRelationships',
            q: `PersonNumber='${carnetPad}'`,
            fields: 'PersonNumber,DisplayName,PrimaryWorkRelationshipName',
          },
          timeout: 5000,
        }),
      );
      const data = response.data;
      if (!data.items || data.items.length === 0) return null;
      const rel = data.items[0].workRelationships?.[0];
      const terminado = rel?.TerminationDate ? new Date(rel.TerminationDate) < new Date() : false;
      return {
        activo: !terminado,
        cargo: rel?.PrimaryAssignment?.JobName || null,
        empresa: rel?.PrimaryAssignment?.LegalEntityName || null,
      };
    } catch {
      return null;
    }
  }
}