import { NextRequest, NextResponse } from 'next/server';
import { getCustomer } from '@/lib/googleads';

const MANAGER_ID = '7782195323';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string; campaignId: string }> }
) {
  try {
    const { accountId, campaignId } = await params;
    const { status } = await request.json();

    if (!status || !['ENABLED', 'PAUSED', 'REMOVED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    const customer = getCustomer(accountId, MANAGER_ID);

    // Update campaign status
    await customer.campaigns.update([{
      resource_name: `customers/${accountId}/campaigns/${campaignId}`,
      status,
    }]);

    return NextResponse.json({
      success: true,
      message: 'Campaign status updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating campaign status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update campaign status',
      },
      { status: 500 }
    );
  }
}
