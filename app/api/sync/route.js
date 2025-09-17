export async function POST(request) {
  try {
    const data = await request.json();
    console.log('Received sync data:', data);
    // Placeholder for server-side database save
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