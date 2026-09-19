export interface ParamMetadata {
  index: number;
  type: 'params' | 'body' | 'query';
  key?: string;
  dtoClass?: new () => object;
}
