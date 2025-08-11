declare namespace App.Models {
    export type CheckoutSession = {
        incrementing: boolean;
        preventsLazyLoading: boolean;
        exists: boolean;
        wasRecentlyCreated: boolean;
        timestamps: boolean;
        usesUniqueIds: boolean;
    };
    export type Postcard = {
        incrementing: boolean;
        preventsLazyLoading: boolean;
        exists: boolean;
        wasRecentlyCreated: boolean;
        timestamps: boolean;
        usesUniqueIds: boolean;
    };
    export type User = {
        incrementing: boolean;
        preventsLazyLoading: boolean;
        exists: boolean;
        wasRecentlyCreated: boolean;
        timestamps: boolean;
        usesUniqueIds: boolean;
    };
}
