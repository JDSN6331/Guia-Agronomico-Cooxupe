async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      // Carregamento dinâmico compatível com ESM / SSR em tempo de execução
      const nodemailerModule = await import("nodemailer");
      const nodemailer = nodemailerModule.default || nodemailerModule;
      if (typeof nodemailer.createTransport === "function") {
        return nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
      }
    } catch (err) {
      console.warn("[SMTP Warning] Não foi possível carregar o módulo nodemailer:", err);
    }
  }
  return null;
}

export async function enviarEmailConvite(input: {
  toEmail: string;
  nome: string;
  link: string;
}): Promise<boolean> {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || "Guia Agronômico Cooxupé <nao-responder@cooxupe.com.br>";
  const subject = "Convite de acesso | Guia Agronômico Cooxupé";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #12281b; background-color: #f9fbf9; border-radius: 12px; border: 1px solid #e1e9e3;">
      <h2 style="color: #2a6e42; margin-top: 0;">Bem-vindo ao Guia Agronômico Cooxupé</h2>
      <p>Olá, <strong>${input.nome}</strong>!</p>
      <p>Você foi convidado para acessar a plataforma de Desenvolvimento Técnico Cooxupé.</p>
      <p>Para concluir o seu cadastro e criar a sua senha de acesso, clique no botão abaixo:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${input.link}" style="background-color: #2a6e42; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Definir Minha Senha</a>
      </div>
      <p style="font-size: 13px; color: #555;">Se o botão acima não funcionar, copie e cole o seguinte link no seu navegador:</p>
      <p style="font-size: 13px; word-break: break-all;"><a href="${input.link}" style="color: #2a6e42;">${input.link}</a></p>
      <hr style="border: 0; border-top: 1px solid #e1e9e3; margin: 25px 0;" />
      <p style="font-size: 12px; color: #888;">Este link é válido por 48 horas. Caso você não tenha solicitado este acesso, por favor desconsidere este e-mail.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: input.toEmail,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.error("[SMTP Error] Falha ao enviar e-mail via servidor SMTP:", err);
      return false;
    }
  } else {
    console.log("=================================================");
    console.log(`[E-MAIL CONVITE PARA: ${input.toEmail}]`);
    console.log(`LINK DE ACESSO: ${input.link}`);
    console.log("=================================================");
    return false;
  }
}

export async function enviarEmailRecuperacao(input: {
  toEmail: string;
  link: string;
}): Promise<boolean> {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || "Guia Agronômico Cooxupé <nao-responder@cooxupe.com.br>";
  const subject = "Recuperação de Acesso | Guia Agronômico Cooxupé";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #12281b; background-color: #f9fbf9; border-radius: 12px; border: 1px solid #e1e9e3;">
      <h2 style="color: #2a6e42; margin-top: 0;">Recuperação de Senha</h2>
      <p>Recebemos uma solicitação para redefinir a sua senha no Guia Agronômico Cooxupé.</p>
      <p>Clique no botão abaixo para definir uma nova senha:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${input.link}" style="background-color: #2a6e42; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Redefinir Senha</a>
      </div>
      <p style="font-size: 13px; color: #555;">Link direto:</p>
      <p style="font-size: 13px; word-break: break-all;"><a href="${input.link}" style="color: #2a6e42;">${input.link}</a></p>
      <hr style="border: 0; border-top: 1px solid #e1e9e3; margin: 25px 0;" />
      <p style="font-size: 12px; color: #888;">Se você não solicitou a alteração de senha, ignore este e-mail.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: input.toEmail,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.error("[SMTP Error] Falha ao enviar e-mail de recuperação via SMTP:", err);
      return false;
    }
  } else {
    console.log("=================================================");
    console.log(`[E-MAIL RECUPERAÇÃO PARA: ${input.toEmail}]`);
    console.log(`LINK DE RECUPERAÇÃO: ${input.link}`);
    console.log("=================================================");
    return false;
  }
}
