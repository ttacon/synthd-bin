export type FieldMetadata = {
    dbType: string;
    nullable: boolean;
    defaultValue: string | null;
    extra: string;
    keyType: string;
};

export type FieldType = {
    name: string;
    metadata: FieldMetadata[];
    likelyType: string;
};

export type ResourceSchema = {
    resourceName: string;
    fields: FieldType[];
};
