
/*
 * This example shows how results from a query can be received in an iterative
 * mode and illustrated in a table.
 
 */
var basex  = require("../index");

// commands to be performed
var cmd = 'for $node in doc("factbook")//country order by xs:int($node/@population) return data($node/@name)';
var cmd2 = 'for $node in doc("factbook")//country order by xs:int($node/@population) return data($node/@population)';


var session = new basex.Session("localhost", 1984, "admin", "admin");
@TODO  
  echo "<table border='0' cellspacing='2' cellpadding='4' width='20%'><tbody><tr style='text-align:center;'>";
  echo "<td style='text-align:center;background-color:#D7D7D7;border:#ffffff 1px solid;font-size:12pt;'></td>";
  echo "<td style='text-align:center;background-color:#D7D7D7;border:#ffffff 1px solid;font-size:12pt;'>Country</td>";
  echo "<td style='text-align:center;background-color:#D7D7D7;border:#ffffff 1px solid;font-size:12pt;'>Population</td>";
  try {
    $query = $session->query($cmd);
    print $query->init();
    $query2 = $session->query($cmd2);
    print $query2->init();
    $count = 0;
    while($query->more()) {
      $next = $query->next();
      $query2->more();
      $next2 = $query2->next();
      $count += 1;
      if($count%2) {
        echo "<tr style='text-align:center;'>
      <td style='text-align:center;'>$count</td><td style='text-align:center;'>$next</td>
        <td style='text-align:center;'>$next2</td></tr>";
      } else {
      echo "<tr style='text-align:center; background-color:#eeeeee;'>
      <td style='text-align:center;'>$count</td><td style='text-align:center;'>$next</td>
        <td style='text-align:center;'>$next2</td></tr>";
      }
      }
    $query->close();
    $query2->close();
  } catch (Exception $e) {
    // print exception
    print $e->getMessage();
  }  
  echo "</tbody></table>";
  $query->close();
  // close session
  $session->close();

