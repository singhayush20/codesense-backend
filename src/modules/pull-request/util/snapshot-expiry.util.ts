export class SnapshotExpiryUtil {
    static buildExpiryDate(
        retentionDays: number = 14,
    ) : Date {
        const expiryDate = new Date();

        expiryDate.setDate(expiryDate.getDate() + retentionDays);

        return expiryDate;
    }
}