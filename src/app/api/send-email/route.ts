import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, template, data } = await request.json();

    // Ici vous pouvez intégrer votre service d'envoi d'email préféré
    // Par exemple : SendGrid, Mailgun, Resend, etc.
    
    // Exemple avec un service fictif (à remplacer par votre service réel)
    const emailService = {
      send: async (emailData: any) => {
        // Simulation d'envoi d'email
        console.log('Email envoyé:', emailData);
        return { success: true };
      }
    };

    let emailContent = '';
    
    if (template === 'rejection') {
      emailContent = `
        <h2>Demande d'inscription rejetée</h2>
        <p>Bonjour ${data.name},</p>
        <p>Nous regrettons de vous informer que votre demande d'inscription a été rejetée par l'administrateur.</p>
        <p><strong>Raison :</strong> ${data.reason}</p>
        <p><strong>Contact :</strong> ${data.contact}</p>
        <p>Cordialement,<br>L'équipe d'administration</p>
      `;
    } else if (template === 'approval') {
      emailContent = `
        <h2>Compte approuvé - Connexion autorisée</h2>
        <p>Bonjour ${data.name},</p>
        <p>Félicitations ! Votre compte a été approuvé par l'administrateur.</p>
        <p>${data.message}</p>
        <p><a href="${data.loginUrl}">Cliquez ici pour vous connecter</a></p>
        <p>Cordialement,<br>L'équipe d'administration</p>
      `;
    }

    const emailData = {
      to,
      subject,
      html: emailContent,
      from: 'noreply@votreapp.com' // Remplacez par votre email d'expédition
    };

    const result = await emailService.send(emailData);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Email envoyé avec succès' 
      });
    } else {
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }

  } catch (error) {
    console.error('Erreur API send-email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'envoi de l\'email' 
      },
      { status: 500 }
    );
  }
}
