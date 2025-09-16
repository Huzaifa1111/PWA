export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Received sync data:', data);
    // Here you would typically save to a server-side database (e.g., MongoDB, PostgreSQL)
    // For demo, just log and return success
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing sync request:', error);
    return new Response(JSON.stringify({ error: 'Failed to process sync request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}