import { Processor, Process } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import type { Job } from "bull";

// Trade application processor — handles jobs for trade account application notifications.
// Job data: { applicationId, eventType, accountEmail, companyName }
// Event types: 'submitted', 'approved', 'rejected'
//
// See guidelines/09-notifications-and-jobs.md and guidelines/04-accounts-and-tiers.md
// for the trade application workflow.

export interface TradeApplicationJob {
  applicationId: string;
  eventType: "submitted" | "approved" | "rejected";
  accountEmail: string;
  companyName?: string;
  rejectionReason?: string;
}

@Processor("trade-applications")
export class TradeApplicationProcessor {
  private readonly logger = new Logger(TradeApplicationProcessor.name);

  @Process()
  async handleTradeApplication(job: Job<TradeApplicationJob>) {
    const { applicationId, eventType, accountEmail } = job.data;
    this.logger.log(`Processing trade application notification: ${applicationId} — ${eventType}`);

    switch (eventType) {
      case "submitted":
        await this.sendSubmissionConfirmation(job.data);
        break;
      case "approved":
        await this.sendApprovalNotification(job.data);
        break;
      case "rejected":
        await this.sendRejectionNotification(job.data);
        break;
      default:
        this.logger.warn(`Unknown trade application event type: ${eventType}`);
    }
  }

  private async sendSubmissionConfirmation(data: TradeApplicationJob) {
    this.logger.log(`Trade application submitted confirmation to ${data.accountEmail}`);
    // TODO(4.11): real email — "We've received your trade application"
  }

  private async sendApprovalNotification(data: TradeApplicationJob) {
    this.logger.log(`Trade application approved notification to ${data.accountEmail}`);
    // TODO(4.11): real email — "Your trade account is approved" + tier benefits
  }

  private async sendRejectionNotification(data: TradeApplicationJob) {
    this.logger.log(`Trade application rejected notification to ${data.accountEmail}`);
    // TODO(4.11): real email — "Your trade application was not approved" + reason
  }
}
