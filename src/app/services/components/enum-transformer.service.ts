import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EnumTransformerService {
  constructor() {}

  enumToLabelValue<T extends object>(
    enumObject: T,
    transformFn: (value: T[keyof T]) => string,
  ): { label: string; value: keyof T | T[keyof T] }[] {
    return Object.values(enumObject)
      .map((value) => ({
        label: transformFn(value), // Utilisation de la fonction de transformation
        value,
      }))
      .sort((a, b) => a.label!.localeCompare(b.label!));
  }
}
