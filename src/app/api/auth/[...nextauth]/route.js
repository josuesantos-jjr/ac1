import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Configuração básica do NextAuth (comentada temporariamente)
// Descomente quando precisar implementar autenticação

/*
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
*/

// Handler temporário para evitar erros durante desenvolvimento
export async function GET() {
  return Response.json({ error: 'NextAuth not configured yet' }, { status: 404 });
}

export async function POST() {
  return Response.json({ error: 'NextAuth not configured yet' }, { status: 404 });
}