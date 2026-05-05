import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const business = formData.get('business') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const website = formData.get('website') as string;
    const photo = formData.get('photo') as File | null;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

const cookieStore = await cookies();

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.delete({ name, ...options });
      },
    },
  }
);

    const sessionId = crypto.randomUUID();

    const { data: card, error: insertError } = await supabase
      .from('cards')
      .insert([
        {
          name,
          title,
          business,
          email,
          phone,
          website,
          status: 'pending',
          session_id: sessionId,
        },
      ])
      .select()
      .single();

    if (insertError || !card) {
      return NextResponse.json(
        { error: insertError?.message || 'Insert failed.' },
        { status: 500 }
      );
    }

    let photoUrl: string | null = null;

    if (photo && photo.size > 0) {
      const path = `${card.id}/${Date.now()}.jpg`;

      const arrayBuffer = await photo.arrayBuffer();

      await supabase.storage
        .from('profile-photos')
        .upload(path, arrayBuffer, {
          contentType: photo.type,
        });

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path);

      photoUrl = urlData.publicUrl;

      await supabase
        .from('cards')
        .update({ profile_photo_url: photoUrl })
        .eq('id', card.id);
    }

    // ✅ SAFETY CHECK: prevent crash if env is missing
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Missing RESEND_API_KEY' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const adminUrl =
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/submissions`;

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.ADMIN_EMAIL || 'lhuynh@dvc.edu',
      subject: `New Business Card Submission: ${name}`,
      html: `
        <h2>New Submission Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Company:</strong> ${business || '—'}</p>
        <p><a href="${adminUrl}">Review Submission</a></p>
      `,
    });

    return NextResponse.json({ success: true, id: card.id });
  } catch (err: any) {
    console.error(err); // ✅ important for Vercel logs

    return NextResponse.json(
      { error: err.message || 'Server error.' },
      { status: 500 }
    );
  }
}
