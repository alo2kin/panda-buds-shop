import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Package, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Session, User } from "@supabase/supabase-js";

interface OrderItem {
  productId: string;
  name: string;
  color: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  municipality: string;
  city: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  courier_service: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;
      
      const hasAdmin = !!data;
      setIsAdmin(hasAdmin);
      
      if (hasAdmin) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Parse items from JSON and cast to Order type
      const parsedOrders: Order[] = (data || []).map((order) => ({
        ...order,
        items: order.items as unknown as OrderItem[],
      }));
      
      setOrders(parsedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Greška pri učitavanju porudžbina");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success("Status porudžbine ažuriran");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Greška pri ažuriranju statusa");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      shipped: "outline",
      delivered: "default",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "Na čekanju",
      processing: "U obradi",
      shipped: "Poslato",
      delivered: "Isporučeno",
      cancelled: "Otkazano",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      `${order.first_name} ${order.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-bamboo-dark" />
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Pristup odbijen</h1>
            <p className="text-muted-foreground mb-4">
              Nemate admin privilegije za pristup ovoj stranici.
            </p>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Odjavi se
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-bamboo-dark" />
            <h1 className="text-2xl font-bold">Admin Panel - Porudžbine</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Osveži
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Odjavi se
            </Button>
          </div>
        </div>

        <div className="bg-background rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Pretraga
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Pretraži po imenu, telefonu, emailu ili ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter po statusu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi statusi</SelectItem>
                  <SelectItem value="pending">Na čekanju</SelectItem>
                  <SelectItem value="processing">U obradi</SelectItem>
                  <SelectItem value="shipped">Poslato</SelectItem>
                  <SelectItem value="delivered">Isporučeno</SelectItem>
                  <SelectItem value="cancelled">Otkazano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-background rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Kupac</TableHead>
                  <TableHead>Kontakt</TableHead>
                  <TableHead>Adresa</TableHead>
                  <TableHead>Proizvodi</TableHead>
                  <TableHead>Kurir</TableHead>
                  <TableHead className="text-right">Ukupno</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nema porudžbina za prikaz
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(order.created_at), "dd.MM.yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {order.first_name} {order.last_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{order.phone}</div>
                          <div className="text-muted-foreground">{order.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{order.address}</div>
                          <div className="text-muted-foreground">
                            {order.municipality}, {order.city}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx}>
                              {item.quantity}x {item.name} ({item.color})
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.courier_service}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {order.total.toLocaleString("sr-RS")} RSD
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>{getStatusBadge(order.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Na čekanju</SelectItem>
                            <SelectItem value="processing">U obradi</SelectItem>
                            <SelectItem value="shipped">Poslato</SelectItem>
                            <SelectItem value="delivered">Isporučeno</SelectItem>
                            <SelectItem value="cancelled">Otkazano</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground text-center">
          Prikazano {filteredOrders.length} od {orders.length} porudžbina
        </div>
      </main>
      <Footer />
    </div>
  );
};

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });
        if (error) throw error;
        toast.success("Registracija uspešna! Sada se možete prijaviti.");
        setIsSignup(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(isSignup ? "Greška pri registraciji" : "Greška pri prijavi", {
        description: error.message || "Proverite email i lozinku",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-background rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <Package className="h-12 w-12 text-bamboo-dark mx-auto mb-4" />
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground mt-2">
                {isSignup ? "Kreirajte admin nalog" : "Prijavite se za pristup porudžbinama"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Lozinka</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                variant="accent"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isSignup ? "Registracija..." : "Prijavljivanje..."}
                  </>
                ) : (
                  isSignup ? "Registruj se" : "Prijavi se"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isSignup ? "Već imate nalog? Prijavite se" : "Nemate nalog? Registrujte se"}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
