export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <html lang="en" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
