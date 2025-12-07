import { describe, it, expect } from 'vitest';
import {
  MinimalBootstrap,
  PrototypeBuilder,
  CoreSystemBuilder,
  AuthManagerBuilder,
  CharGenBuilder,
  PreAuthHandlerBuilder,
  RecyclerBuilder,
  AliasLoader,
} from '../../src/database/bootstrap/index.js';

describe('Bootstrap Index Exports', () => {
  it('should export MinimalBootstrap', () => {
    expect(MinimalBootstrap).toBeDefined();
    expect(typeof MinimalBootstrap).toBe('function');
  });

  it('should export PrototypeBuilder', () => {
    expect(PrototypeBuilder).toBeDefined();
    expect(typeof PrototypeBuilder).toBe('function');
  });

  it('should export CoreSystemBuilder', () => {
    expect(CoreSystemBuilder).toBeDefined();
    expect(typeof CoreSystemBuilder).toBe('function');
  });

  it('should export AuthManagerBuilder', () => {
    expect(AuthManagerBuilder).toBeDefined();
    expect(typeof AuthManagerBuilder).toBe('function');
  });

  it('should export CharGenBuilder', () => {
    expect(CharGenBuilder).toBeDefined();
    expect(typeof CharGenBuilder).toBe('function');
  });

  it('should export PreAuthHandlerBuilder', () => {
    expect(PreAuthHandlerBuilder).toBeDefined();
    expect(typeof PreAuthHandlerBuilder).toBe('function');
  });

  it('should export RecyclerBuilder', () => {
    expect(RecyclerBuilder).toBeDefined();
    expect(typeof RecyclerBuilder).toBe('function');
  });

  it('should export AliasLoader', () => {
    expect(AliasLoader).toBeDefined();
    expect(typeof AliasLoader).toBe('function');
  });
});
