import { NextRequest, NextResponse } from 'next/server';
import { getCustomer } from '@/lib/googleads';

const MANAGER_ID = '7782195323';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string; campaignId: string }> }
) {
  try {
    const { accountId, campaignId } = await params;
    const { budget } = await request.json();

    if (!budget || budget <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid budget amount' },
        { status: 400 }
      );
    }

    const customer = getCustomer(accountId, MANAGER_ID);

    // Get campaign to find budget resource name
    const campaignQuery = `
      SELECT
        campaign.id,
        campaign.campaign_budget
      FROM campaign
      WHERE campaign.id = ${campaignId}
      LIMIT 1
    `;

    const campaignResults = await customer.query(campaignQuery);

    if (campaignResults.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const budgetResourceName = campaignResults[0].campaign?.campaign_budget;

    // Update budget
    await customer.campaignBudgets.update([{
      resource_name: budgetResourceName,
      amount_micros: budget * 1_000_000, // Convert to micros
    }]);

    return NextResponse.json({
      success: true,
      message: 'Campaign budget updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating campaign budget:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update campaign budget',
      },
      { status: 500 }
    );
  }
}
